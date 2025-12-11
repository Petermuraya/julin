import { Link, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2 bg-card p-4 rounded-lg">
          <h2 className="font-semibold mb-4">Admin Portal</h2>
          <nav className="flex flex-col gap-2">
            <Link to="/admin" className="text-sm text-primary">Dashboard</Link>
            <Link to="properties" className="text-sm">Properties</Link>
            <Link to="submissions" className="text-sm">Submissions</Link>
            <Link to="inquiries" className="text-sm">Buyer Inquiries</Link>
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
