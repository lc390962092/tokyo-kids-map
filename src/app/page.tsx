import { MapExperience } from "@/components/map/map-experience";
import { getPlaceRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const places = await getPlaceRepository().findAll();

  return <MapExperience places={places} />;
}
