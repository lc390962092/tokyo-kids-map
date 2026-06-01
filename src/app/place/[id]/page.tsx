import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Baby, Car, CloudRain, MapPin, Ticket } from "lucide-react";
import { RatingStars } from "@/components/place/rating-stars";
import { getCategoryLabel } from "@/data/place-options";
import { getPlaceRepository } from "@/lib/repositories";

type PlacePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const places = await getPlaceRepository().findAll();
  return places.map((place) => ({ id: place.id }));
}

export async function generateMetadata({
  params,
}: PlacePageProps): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlaceRepository().findById(id);

  if (!place) {
    return { title: "地点未找到" };
  }

  return {
    title: place.nameZh,
    description: `${place.nameZh}：${place.description}`,
    openGraph: {
      title: `${place.nameZh} | 东京溜娃地图`,
      description: place.description,
      images: [{ url: place.imageUrl }],
    },
  };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { id } = await params;
  const place = await getPlaceRepository().findById(id);

  if (!place) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fffaf4] text-[#2c3834]">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#76584e] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          返回地图
        </Link>

        <section className="mt-5 overflow-hidden rounded-[28px] bg-white shadow-xl shadow-[#d9a58f]/15">
          <div
            className="h-64 bg-cover bg-center sm:h-80"
            style={{ backgroundImage: `url(${place.imageUrl})` }}
          />
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-[#fff0e8] px-3 py-1 text-sm font-black text-[#f27d68]">
                {getCategoryLabel(place.category)} · {place.ward}
              </div>
              <h1 className="text-4xl font-black tracking-normal">
                {place.nameZh}
              </h1>
              <p className="mt-2 text-xl font-bold text-[#7b665b]">
                {place.nameJa}
              </p>
              <p className="mt-6 text-base leading-8 text-[#5f6d68]">
                {place.description}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoPill icon={<Baby className="h-4 w-4" />} label="推荐年龄">
                  {place.ageMin}-{place.ageMax} 岁
                </InfoPill>
                <InfoPill icon={<MapPin className="h-4 w-4" />} label="最近车站">
                  {place.nearestStation}
                </InfoPill>
                <InfoPill icon={<Ticket className="h-4 w-4" />} label="门票">
                  {place.freeEntry ? "免费" : "收费 / 部分收费"}
                </InfoPill>
                <InfoPill icon={<CloudRain className="h-4 w-4" />} label="雨天">
                  {place.rainyDay ? "适合雨天" : "晴天更适合"}
                </InfoPill>
                <InfoPill icon={<Baby className="h-4 w-4" />} label="婴儿车">
                  {place.strollerScore >= 4 ? "比较友好" : "需要留意动线"}
                </InfoPill>
                <InfoPill icon={<Car className="h-4 w-4" />} label="停车">
                  {place.parkingScore >= 4 ? "相对方便" : "建议公共交通"}
                </InfoPill>
              </div>

              <div className="mt-8 rounded-3xl bg-[#f4fbf7] p-5">
                <h2 className="text-lg font-black">家长 Tips</h2>
                <p className="mt-3 leading-7 text-[#5f6d68]">{place.tips}</p>
              </div>
            </div>

            <aside className="space-y-3">
              <RatingStars label="停车" value={place.parkingScore} />
              <RatingStars label="婴儿车" value={place.strollerScore} />
              <RatingStars label="换尿布" value={place.diaperScore} />
              <RatingStars label="放电指数" value={place.playScore} />
              <div className="rounded-2xl border border-[#ffe0ce] bg-[#fff8ee] p-4 text-sm font-bold leading-7 text-[#76584e]">
                {place.address}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoPill({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] p-4">
      <div className="flex items-center gap-2 text-xs font-black text-[#f27d68]">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-[#3c4a45]">{children}</div>
    </div>
  );
}
