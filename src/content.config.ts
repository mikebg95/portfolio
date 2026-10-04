import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import {
  certificationSchema,
  educationSchema,
  experienceSchema,
  profileSchema,
  projectSchema,
} from './content/schemas';

// Astro 6+ reads this file, not `src/content/config.ts` (docs/RECORD.md 2026-10-04).
// Entries are `src/content/<collection>/<lang>/<id>.yaml` and their ids are `<lang>/<id>`, always
// from the path: the default would take a `slug` field instead and collide the EN and NL twins.
// The schemas live in ./content/schemas.ts so the unit tests can use them without Astro.
const files = (name: string) =>
  glob({
    pattern: '*/*.yaml',
    base: `./src/content/${name}`,
    generateId: ({ entry }) => entry.replace(/\.yaml$/, ''),
  });

export const collections = {
  experience: defineCollection({ loader: files('experience'), schema: experienceSchema }),
  projects: defineCollection({ loader: files('projects'), schema: projectSchema }),
  certifications: defineCollection({
    loader: files('certifications'),
    schema: certificationSchema,
  }),
  education: defineCollection({ loader: files('education'), schema: educationSchema }),
  profile: defineCollection({ loader: files('profile'), schema: profileSchema }),
};
