export default function DashboardPage() {
    return (
        <main className="p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4">Dashboard</h1>
            <p className="text-muted-foreground">
                Welcome to your workspace! Since you made it here, that means the WorkspaceProvider 
                successfully verified your context and injected your X-Workspace-Id header.
            </p>
        </main>
    );
}
