import { MapExperience } from "@/components/map/map-experience";
import { getPlaceRepository } from "@/lib/repositories";

export default async function Home() {
  const places = await getPlaceRepository().findAll();

  return <MapExperience places={places} />;
}
