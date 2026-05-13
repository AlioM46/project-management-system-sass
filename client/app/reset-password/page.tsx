import ResetPassword from "@/features/auth/pages/ResetPassword";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const email = typeof params.email === 'string' ? params.email : undefined;
    const token = typeof params.token === 'string' ? params.token : undefined;

    return <ResetPassword email={email} token={token} />;
}
