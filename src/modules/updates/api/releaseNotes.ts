import axios from 'axios';

export interface PublishedRelease {
  notes: string | null;
  date: string | null;
}

const RELEASES_API = 'https://api.github.com/repos/StackOverlords/TPS_INTERMOTORS/releases/tags';

/**
 * Notas publicadas de una versión ya instalada. El tag lleva la variante del
 * tenant (ej. v1.13.0-t1). Lanza si no hay red o la versión no tiene release.
 */
export async function fetchReleaseNotes(
  version: string,
  variant: string | null,
): Promise<PublishedRelease> {
  const tag = variant ? `v${version}-${variant}` : `v${version}`;
  const { data } = await axios.get<{ body?: string | null; published_at?: string | null }>(
    `${RELEASES_API}/${tag}`,
  );
  return { notes: data.body?.trim() || null, date: data.published_at || null };
}
