import type { UploadModelModelDefinition } from './types'

export const UPLOAD_MODEL_MODEL: UploadModelModelDefinition = {
  id: 'utility:upload-model',
  label: 'Upload Model',
  description:
    'Registers a self-hosted .safetensors checkpoint, LoRA, LyCORIS, VAE, or embedding with Runware so it can be used as a model in generation requests.',
  taskType: 'uploadModel',
}
