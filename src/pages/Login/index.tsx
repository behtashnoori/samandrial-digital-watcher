import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  username: z.string().min(1, "الزامی"),
  password: z.string().min(1, "الزامی"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.username, data.password);
      navigate("/");
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card p-6 rounded-lg space-y-4 w-80"
      >
        <h1 className="text-center text-lg font-bold">ورود</h1>
        <div>
          <Input placeholder="نام کاربری" {...register("username")} />
          {errors.username && (
            <p className="text-destructive text-sm mt-1">
              {errors.username.message}
            </p>
          )}
        </div>
        <div>
          <Input
            type="password"
            placeholder="رمز عبور"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        <Button className="w-full" disabled={isSubmitting}>
          ورود
        </Button>
      </form>
    </div>
  );
}
