import VerifyEmail from "@/features/auth/pages/VerifyEmail";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const id = typeof params.id === "string" ? params.id : undefined;
    const hash = typeof params.hash === "string" ? params.hash : undefined;
    const expires = typeof params.expires === "string" ? params.expires : undefined;
    const signature = typeof params.signature === "string" ? params.signature : undefined;

    return <VerifyEmail id={id} hash={hash} expires={expires} signature={signature} />;
}
