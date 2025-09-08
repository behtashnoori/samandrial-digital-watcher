import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManagementsTab from "./ManagementsTab";
import UnitsTab from "./UnitsTab";
import HeadsTab from "./HeadsTab";
import TenureTab from "./TenureTab";
import ServiceAssignmentTab from "./ServiceAssignmentTab";

export default function OrgStructure() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ساختار سازمانی</h1>
      <Tabs defaultValue="managements" className="space-y-4">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="managements">مدیریت‌ها</TabsTrigger>
          <TabsTrigger value="units">واحدها</TabsTrigger>
          <TabsTrigger value="heads">رؤسا</TabsTrigger>
          <TabsTrigger value="tenure">دوره‌ها</TabsTrigger>
          <TabsTrigger value="assign">نگاشت خدمت</TabsTrigger>
        </TabsList>
        <TabsContent value="managements">
          <ManagementsTab />
        </TabsContent>
        <TabsContent value="units">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="heads">
          <HeadsTab />
        </TabsContent>
        <TabsContent value="tenure">
          <TenureTab />
        </TabsContent>
        <TabsContent value="assign">
          <ServiceAssignmentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
