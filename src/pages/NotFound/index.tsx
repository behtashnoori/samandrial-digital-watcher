import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-100">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold">۴۰۴</h1>
      <p className="text-xl text-gray-600">صفحه یافت نشد</p>
      <Link to="/" className="text-blue-500 underline hover:text-blue-700">
        بازگشت به خانه
      </Link>
    </div>
  </div>
);

export default NotFound;
