import type { ExtractMetadataModelDefinition } from './types'

export const EXTRACT_METADATA_MODEL: ExtractMetadataModelDefinition = {
  id: 'utility:extract-metadata',
  label: 'Extract Metadata',
  description:
    'Reads generation settings (prompt, model, seed, etc) embedded in a PNG, JPEG, or WEBP saved from this app, so you can inspect or remix it later.',
  taskType: 'extractMetadata',
}
