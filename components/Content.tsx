import { useState, useEffect } from 'react';


const API_URL = 'https://my-backend-production-220b.up.railway.app';

type Article = {
    id: number;
    attributes: {
        title: string;
        content: string;
        coverImage?: { data: { attributes: { url: string } } };
    };
};

type Gallery = {
    id: number;
    attributes: {
        title: string;
        images?: { data: { attributes: { url: string } }[] };
    };
};

type Announcement = {
    id: number;
    attributes: {
        title: string;
        content: string;
        coverImage?: { data: { attributes: { url: string } } };
        date: string;
        hour: string;
    };
};

export function Content() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [galleries, setGalleries] = useState<Gallery[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [articlesRes, galleriesRes, announcementsRes] = await Promise.all([
                    fetch(`${API_URL}/api/articles?populate=*`).then((r) => r.json()),
                    fetch(`${API_URL}/api/galleries?populate=*`).then((r) => r.json()),
                    fetch(`${API_URL}/api/announcements?populate=*`).then((r) => r.json()),
                ]);

                setArticles(articlesRes.data);
                setGalleries(galleriesRes.data);
                setAnnouncements(announcementsRes.data);
            } catch (err) {
                console.error('Error fetching content:', err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) return <p>Loading content...</p>;

    return (
        <div className="content-container">
            {/* Articles */}
            <h2>Articles</h2>
            <div className="articles">
                {articles.map((article) => (
                    <div key={article.id} className="article-card">
                        <h3>{article.attributes.title}</h3>
                        {article.attributes.coverImage?.data && (
                            <img
                                src={`${API_URL}${article.attributes.coverImage.data.attributes.url}`}
                                alt={article.attributes.title}
                                style={{ maxWidth: '300px' }}
                                loading="lazy"
                            />
                        )}
                        <p>{article.attributes.content}</p>
                    </div>
                ))}
            </div>

            {/* Galleries */}
            <h2>Galleries</h2>
            <div className="galleries">
                {galleries.map((gallery) => (
                    <div key={gallery.id} className="gallery-card">
                        <h3>{gallery.attributes.title}</h3>
                        <div
                            className="gallery-images"
                            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}
                        >
                            {gallery.attributes.images?.data.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={`${API_URL}${img.attributes.url}`}
                                    alt={`${gallery.attributes.title}-${idx}`}
                                    style={{ maxWidth: '200px' }}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Announcements */}
            <h2>Announcements</h2>
            <div className="announcements">
                {announcements.map((ann) => (
                    <div key={ann.id} className="announcement-card">
                        <h3>{ann.attributes.title}</h3>
                        <p>
                            {ann.attributes.date} {ann.attributes.hour}
                        </p>
                        {ann.attributes.coverImage?.data && (
                            <img
                                src={`${API_URL}${ann.attributes.coverImage.data.attributes.url}`}
                                alt={ann.attributes.title}
                                style={{ maxWidth: '300px' }}
                                loading="lazy"
                            />
                        )}
                        <p>{ann.attributes.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}