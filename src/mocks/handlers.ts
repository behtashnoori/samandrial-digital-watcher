import { http, HttpResponse } from "msw";

const triggers = [
  {
    id: 1,
    date: "2024-01-01",
    service_code: "SC001",
    service_name: "خدمت اول",
    management: "مدیریت A",
    unit: "واحد A1",
    budget: 1000,
    actual: 800,
    deviation_pct: -20,
    severity: "Low",
    due_at: "2024-02-01",
    head_name: "مدیر اول",
    assigned_head_id: 1,
    updated: false,
    status: "open",
  },
  {
    id: 2,
    date: "2024-01-02",
    service_code: "SC002",
    service_name: "خدمت دوم",
    management: "مدیریت B",
    unit: "واحد B1",
    budget: 2000,
    actual: 2500,
    deviation_pct: 25,
    severity: "High",
    due_at: "2024-02-05",
    head_name: "مدیر دوم",
    assigned_head_id: 2,
    updated: false,
    status: "reminded",
  },
];

interface ResponseMock {
  id: number;
  trigger_id: number | null;
  free_text: string;
  sample_ref?: string;
  actions?: { text: string; owner: string; due_date: string }[];
  submitted_at: string;
  attachments: { id: number; file_name: string; uri: string }[];
}

const responses: ResponseMock[] = [];

let mockSettings = {
  threshold: 10,
  consecutive_days: 2,
  cooldown_days: 5,
  due_hours: 24,
};

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const { username, password } = await request.json();
    if (username === "didehban" && password === "secret") {
      return HttpResponse.json({ username: "didehban", role: "admin" });
    }
    return HttpResponse.json({ error: "ورود ناموفق" }, { status: 401 });
  }),
  http.get("/api/dashboard", () =>
    HttpResponse.json({
      open_triggers: triggers.length,
      high_triggers: triggers.filter((t) => t.severity === "High").length,
      response_rate: responses.length
        ? (responses.length / triggers.length) * 100
        : 0,
      weekly: {
        top_deviations: triggers.map((t) => ({
          service_code: t.service_code,
          unit_id: null,
          deviation: t.deviation_pct,
          updated: t.updated,
        })),
        causes: ["نمونه"],
        open_actions: responses.reduce(
          (sum, r) => sum + (r.actions ? r.actions.length : 0),
          0,
        ),
      },
    }),
  ),
  http.get("/api/triggers", () => HttpResponse.json(triggers)),
  http.get("/api/triggers/:id", ({ params }) => {
    const t = triggers.find((tr) => tr.id === Number(params.id));
    return t ? HttpResponse.json(t) : HttpResponse.json(null, { status: 404 });
  }),
  http.get("/api/triggers/impacted", () =>
    HttpResponse.json(triggers.filter((t) => t.updated)),
  ),
  http.post("/api/notify/trigger/:id", ({ params }) =>
    HttpResponse.json({ url: `/token/mock-${params.id}` }),
  ),
  http.get("/api/token/:token", ({ params }) =>
    HttpResponse.json({ trigger_id: Number(params.token.split("-")[1] || 1) }),
  ),
  http.get("/api/budget/snapshots", () =>
    HttpResponse.json([
      { id: 1, year: 1404, scenario: "base", status: "published", created_at: "2024-01-01" },
      { id: 2, year: 1404, scenario: "base", status: "archived", created_at: "2023-12-01" },
    ]),
  ),
  http.get("/api/budget/diff", () =>
    HttpResponse.json({
      added: [{ service_code: "S3" }],
      removed: [],
      changed: [{ service_code: "S1" }],
    }),
  ),
  http.post("/api/compute/budget-daily", () => {
    triggers.forEach((t) => {
      t.updated = true;
    });
    return HttpResponse.json({
      processed: triggers.length,
      samples: triggers.slice(0, 3).map((t) => ({
        date: t.date,
        service_code: t.service_code,
        unit_id: null,
        qty: t.budget,
        fin: null,
      })),
    });
  }),
  http.post("/api/compute/deviations", () => {
    triggers.forEach((t) => {
      t.severity = Math.abs(t.deviation_pct) >= mockSettings.threshold ? "High" : "Low";
      const base = new Date(`${t.date}T00:00:00Z`);
      const due = new Date(base.getTime() + mockSettings.due_hours * 3600000);
      t.due_at = due.toISOString();
    });
    return HttpResponse.json({
      created: triggers.length,
      samples: triggers.slice(0, 3),
    });
  }),
  http.post("/api/recompute", () => {
    triggers.forEach((t) => {
      t.updated = true;
    });
    return HttpResponse.json({ budget: triggers.length, deviation: triggers.length });
  }),
  http.post("/api/responses", async ({ request }) => {
    const body = await request.json();
    const item = {
      id: Date.now(),
      trigger_id: body.trigger_id,
      free_text: body.free_text,
      sample_ref: body.sample_ref,
      actions: body.actions,
      submitted_at: new Date().toISOString(),
      attachments: [],
    };
    responses.push(item);
    return HttpResponse.json({ id: item.id }, { status: 201 });
  }),
  http.post("/api/responses/:id/attachments", ({ params }) => {
    const resp = responses.find((r) => r.id === Number(params.id));
    if (resp) {
      resp.attachments.push({
        id: Date.now(),
        file_name: "file.txt",
        uri: "/backend/storage/file.txt",
      });
    }
    return HttpResponse.json({ id: Date.now() }, { status: 201 });
  }),
  http.get("/api/responses", () => HttpResponse.json(responses)),
  http.post("/api/rag/search", async ({ request }) => {
    const body = await request.json();
    const q = body.q || "";
    const hits = responses
      .filter((r) => r.free_text.includes(q))
      .map((r) => ({
        text: r.free_text,
        service_code: "SC001",
        period: r.submitted_at.slice(0, 10),
      }));
    return HttpResponse.json(hits);
  }),
  http.post("/api/import/services", ({ request }) => {
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode === "dry-run") {
      return HttpResponse.json({ errors: [{ row: 2, errors: ["نمونه خطا"] }] });
    }
    return HttpResponse.json({ created: 1, updated: 0, deactivated: 0 });
  }),
  http.post("/api/import/budget-annual", ({ request }) => {
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode === "dry-run") {
      return HttpResponse.json({
        errors: [],
        created: ["S1"],
        updated: [],
        deactivated: [],
      });
    }
    return HttpResponse.json({ created: 1, updated: 0, deactivated: 0 });
  }),
  http.post("/api/import/ops-actual", ({ request }) => {
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode === "dry-run") {
      return HttpResponse.json({
        errors: [],
        created: ["1404-01-01-S1-1"],
        updated: [],
      });
    }
    return HttpResponse.json({ created: 1, updated: 0, deactivated: 0 });
  }),
  http.post("/api/import/calendar-1404", ({ request }) => {
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode === "dry-run") {
      return HttpResponse.json({ errors: [] });
    }
    return HttpResponse.json({ created: 1, updated: 0 });
  }),
  http.post("/api/import/seasonality", ({ request }) => {
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode === "dry-run") {
      return HttpResponse.json({ errors: [] });
    }
    return HttpResponse.json({ created: 1, updated: 0 });
  }),
  http.get("/api/templates/services.xlsx", () =>
    HttpResponse.text("", {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }),
  ),
  http.get("/api/templates/budget-annual.xlsx", () =>
    HttpResponse.text("", {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }),
  ),
  http.get("/api/templates/ops-actual.xlsx", () =>
    HttpResponse.text("", {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }),
  ),
  http.get("/api/templates/calendar-1404.xlsx", () =>
    HttpResponse.text("", {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }),
  ),
  http.get("/api/templates/seasonality.xlsx", () =>
    HttpResponse.text("", {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }),
  ),
  // Org structure mock data
  ...(() => {
    let managements: Record<string, unknown>[] = [];
    let units: Record<string, unknown>[] = [];
    let heads: Record<string, unknown>[] = [];
    let tenure: Record<string, unknown>[] = [];
    let assignments: Record<string, unknown>[] = [];
    const services = [
      { code: "S1", name: "خدمت نمونه" },
      { code: "S2", name: "خدمت دوم" },
    ];

    return [
      http.get("/api/org/managements", () => HttpResponse.json(managements)),
      http.post("/api/org/managements", async ({ request }) => {
        const body = await request.json();
        const item = { id: Date.now(), ...body };
        managements.push(item);
        return HttpResponse.json(item, { status: 201 });
      }),
      http.put("/api/org/managements/:id", async ({ request, params }) => {
        const body = await request.json();
        managements = managements.map((m) => (m.id === Number(params.id) ? { ...m, ...body } : m));
        return HttpResponse.json(managements.find((m) => m.id === Number(params.id)));
      }),
      http.delete("/api/org/managements/:id", ({ params }) => {
        managements = managements.filter((m) => m.id !== Number(params.id));
        return HttpResponse.json({});
      }),

      http.get("/api/org/units", () => HttpResponse.json(units)),
      http.post("/api/org/units", async ({ request }) => {
        const body = await request.json();
        const item = { id: Date.now(), ...body };
        units.push(item);
        return HttpResponse.json(item, { status: 201 });
      }),
      http.put("/api/org/units/:id", async ({ request, params }) => {
        const body = await request.json();
        units = units.map((u) => (u.id === Number(params.id) ? { ...u, ...body } : u));
        return HttpResponse.json(units.find((u) => u.id === Number(params.id)));
      }),
      http.delete("/api/org/units/:id", ({ params }) => {
        units = units.filter((u) => u.id !== Number(params.id));
        return HttpResponse.json({});
      }),

      http.get("/api/org/heads", () => HttpResponse.json(heads)),
      http.post("/api/org/heads", async ({ request }) => {
        const body = await request.json();
        const item = { id: Date.now(), ...body };
        heads.push(item);
        return HttpResponse.json(item, { status: 201 });
      }),
      http.put("/api/org/heads/:id", async ({ request, params }) => {
        const body = await request.json();
        heads = heads.map((h) => (h.id === Number(params.id) ? { ...h, ...body } : h));
        return HttpResponse.json(heads.find((h) => h.id === Number(params.id)));
      }),
      http.delete("/api/org/heads/:id", ({ params }) => {
        heads = heads.filter((h) => h.id !== Number(params.id));
        return HttpResponse.json({});
      }),

      http.get("/api/org/tenure", () => HttpResponse.json(tenure)),
      http.post("/api/org/tenure", async ({ request }) => {
        const body = await request.json();
        const overlap = tenure.some(
          (t) =>
            t.unit_id === body.unit_id &&
            (!t.valid_to || new Date(t.valid_to) >= new Date(body.valid_from)) &&
            (!body.valid_to || new Date(t.valid_from) <= new Date(body.valid_to)),
        );
        if (overlap) return HttpResponse.json({ message: "بازه زمانی با رکورد موجود هم‌پوشانی دارد." }, { status: 400 });
        const item = { id: Date.now(), ...body };
        tenure.push(item);
        return HttpResponse.json(item, { status: 201 });
      }),
      http.put("/api/org/tenure/:id", async ({ request, params }) => {
        const body = await request.json();
        const others = tenure.filter((t) => t.id !== Number(params.id));
        const overlap = others.some(
          (t) =>
            t.unit_id === body.unit_id &&
            (!t.valid_to || new Date(t.valid_to) >= new Date(body.valid_from)) &&
            (!body.valid_to || new Date(t.valid_from) <= new Date(body.valid_to)),
        );
        if (overlap) return HttpResponse.json({ message: "بازه زمانی با رکورد موجود هم‌پوشانی دارد." }, { status: 400 });
        tenure = tenure.map((t) => (t.id === Number(params.id) ? { ...t, ...body } : t));
        return HttpResponse.json(tenure.find((t) => t.id === Number(params.id)));
      }),
      http.delete("/api/org/tenure/:id", ({ params }) => {
        tenure = tenure.filter((t) => t.id !== Number(params.id));
        return HttpResponse.json({});
      }),

      http.get("/api/org/service-assignment", () => HttpResponse.json(assignments)),
      http.post("/api/org/service-assignment", async ({ request }) => {
        const body = await request.json();
        const overlap = assignments.some(
          (a) =>
            a.service_code === body.service_code &&
            a.unit_id === body.unit_id &&
            (!a.valid_to || new Date(a.valid_to) >= new Date(body.valid_from)) &&
            (!body.valid_to || new Date(a.valid_from) <= new Date(body.valid_to)),
        );
        if (overlap) return HttpResponse.json({ message: "بازه زمانی با رکورد موجود هم‌پوشانی دارد." }, { status: 400 });
        const item = { id: Date.now(), ...body };
        assignments.push(item);
        return HttpResponse.json(item, { status: 201 });
      }),
      http.put("/api/org/service-assignment/:id", async ({ request, params }) => {
        const body = await request.json();
        const others = assignments.filter((a) => a.id !== Number(params.id));
        const overlap = others.some(
          (a) =>
            a.service_code === body.service_code &&
            a.unit_id === body.unit_id &&
            (!a.valid_to || new Date(a.valid_to) >= new Date(body.valid_from)) &&
            (!body.valid_to || new Date(a.valid_from) <= new Date(body.valid_to)),
        );
        if (overlap) return HttpResponse.json({ message: "بازه زمانی با رکورد موجود هم‌پوشانی دارد." }, { status: 400 });
        assignments = assignments.map((a) => (a.id === Number(params.id) ? { ...a, ...body } : a));
        return HttpResponse.json(assignments.find((a) => a.id === Number(params.id)));
  }),
  http.delete("/api/org/service-assignment/:id", ({ params }) => {
    assignments = assignments.filter((a) => a.id !== Number(params.id));
    return HttpResponse.json({});
  }),

      http.get("/api/services", () => HttpResponse.json(services)),
    ];
  })(),
  http.get("/api/settings", () => HttpResponse.json(mockSettings)),
  http.post("/api/settings", async ({ request }) => {
    const body = await request.json();
    mockSettings = { ...mockSettings, ...body };
    return HttpResponse.json(mockSettings);
  }),
];
