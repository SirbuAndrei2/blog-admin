import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditArticleClient from "./EditArticleClient";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
    const article = await prisma.article.findUnique({
        where: { id: parseInt(params.id) },
        include: { category: true, author: true, meta: true },
    });

    if (!article) notFound();

    return (
        <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
            <EditArticleClient initialArticle={article} />
        </div>
    );
}
