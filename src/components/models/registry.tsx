import type { ModelDefinition } from '../../lib/models'
import {
  FLUX_1_DEV_MODEL,
  ILLUSTRIOUS_MODEL,
  AUTISMMIX_PONY_MODEL,
  FLUX_2_KLEIN_MODEL,
  SEEDREAM_4_5_MODEL,
  SD15_REALISTIC_VISION_MODEL,
  SD15_CHILLOUTMIX_MODEL,
} from '../../lib/models'
import { ZImageForm } from './z-image/ZImageForm'
import { ZImagePricingInfo } from './z-image/ZImagePricingTooltip'
import { UpscaleForm } from './upscale/UpscaleForm'
import { UpscalePricingInfo } from './upscale/UpscalePricingTooltip'
import { MinimaxH3Form } from './minimax-h3/MinimaxH3Form'
import { MinimaxH3PricingInfo } from './minimax-h3/MinimaxH3PricingTooltip'
import { FluxDevForm } from './flux-1-dev/FluxDevForm'
import { FluxDevPricingInfo } from './flux-1-dev/FluxDevPricingTooltip'
import { IllustriousForm } from './illustrious/IllustriousForm'
import { IllustriousPricingInfo } from './illustrious/IllustriousPricingTooltip'
import { AutismmixPonyForm } from './autismmix-pony/AutismmixPonyForm'
import { AutismmixPonyPricingInfo } from './autismmix-pony/AutismmixPonyPricingTooltip'
import { Flux2KleinForm } from './flux-2-klein/Flux2KleinForm'
import { Flux2KleinPricingInfo } from './flux-2-klein/Flux2KleinPricingTooltip'
import { Seedream45Form } from './seedream-4-5/Seedream45Form'
import { Seedream45PricingInfo } from './seedream-4-5/Seedream45PricingTooltip'
import { Sd15RealisticVisionForm } from './sd15-realistic-vision/Sd15RealisticVisionForm'
import { Sd15RealisticVisionPricingInfo } from './sd15-realistic-vision/Sd15RealisticVisionPricingTooltip'
import { Sd15ChilloutmixForm } from './sd15-chilloutmix/Sd15ChilloutmixForm'
import { Sd15ChilloutmixPricingInfo } from './sd15-chilloutmix/Sd15ChilloutmixPricingTooltip'
import { RembgForm } from './rembg/RembgForm'
import { RembgPricingInfo } from './rembg/RembgPricingTooltip'
import { ExtractMetadataForm } from './extract-metadata/ExtractMetadataForm'
import { ExtractMetadataPricingInfo } from './extract-metadata/ExtractMetadataPricingTooltip'
import { UploadModelForm } from './upload-model/UploadModelForm'
import { UploadModelPricingInfo } from './upload-model/UploadModelPricingTooltip'
import { ManageMediaControls } from './manage-media/ManageMediaControls'
import { ManageMediaPricingInfo } from './manage-media/ManageMediaPricingTooltip'
import { IntroductionForm } from './introduction/IntroductionForm'
import { IntroductionPricingInfo } from './introduction/IntroductionPricingTooltip'

// Models sharing taskType 'imageInference' get their own form/pricing-info pair, keyed by model ID.
const IMAGE_INFERENCE_FORMS: Record<string, typeof ZImageForm> = {
  [FLUX_1_DEV_MODEL.id]: FluxDevForm,
  [ILLUSTRIOUS_MODEL.id]: IllustriousForm,
  [AUTISMMIX_PONY_MODEL.id]: AutismmixPonyForm,
  [FLUX_2_KLEIN_MODEL.id]: Flux2KleinForm,
  [SEEDREAM_4_5_MODEL.id]: Seedream45Form,
  [SD15_REALISTIC_VISION_MODEL.id]: Sd15RealisticVisionForm,
  [SD15_CHILLOUTMIX_MODEL.id]: Sd15ChilloutmixForm,
}

const IMAGE_INFERENCE_PRICING_INFO: Record<string, typeof ZImagePricingInfo> = {
  [FLUX_1_DEV_MODEL.id]: FluxDevPricingInfo,
  [ILLUSTRIOUS_MODEL.id]: IllustriousPricingInfo,
  [AUTISMMIX_PONY_MODEL.id]: AutismmixPonyPricingInfo,
  [FLUX_2_KLEIN_MODEL.id]: Flux2KleinPricingInfo,
  [SEEDREAM_4_5_MODEL.id]: Seedream45PricingInfo,
  [SD15_REALISTIC_VISION_MODEL.id]: Sd15RealisticVisionPricingInfo,
  [SD15_CHILLOUTMIX_MODEL.id]: Sd15ChilloutmixPricingInfo,
}

export function ModelForm({ model }: { model: ModelDefinition }) {
  switch (model.taskType) {
    case 'imageInference': {
      const Form = IMAGE_INFERENCE_FORMS[model.id] ?? ZImageForm
      return <Form model={model} />
    }
    case 'upscale':
      return <UpscaleForm model={model} />
    case 'videoInference':
      return <MinimaxH3Form model={model} />
    case 'removeBackground':
      return <RembgForm model={model} />
    case 'extractMetadata':
      return <ExtractMetadataForm />
    case 'uploadModel':
      return <UploadModelForm />
    case 'manageMedia':
      return <ManageMediaControls />
    case 'introduction':
      return <IntroductionForm />
  }
}

export function ModelPricingInfo({ model }: { model: ModelDefinition }) {
  switch (model.taskType) {
    case 'imageInference': {
      const PricingInfo = IMAGE_INFERENCE_PRICING_INFO[model.id] ?? ZImagePricingInfo
      return <PricingInfo model={model} />
    }
    case 'upscale':
      return <UpscalePricingInfo model={model} />
    case 'videoInference':
      return <MinimaxH3PricingInfo model={model} />
    case 'removeBackground':
      return <RembgPricingInfo model={model} />
    case 'extractMetadata':
      return <ExtractMetadataPricingInfo />
    case 'uploadModel':
      return <UploadModelPricingInfo />
    case 'manageMedia':
      return <ManageMediaPricingInfo />
    case 'introduction':
      return <IntroductionPricingInfo />
  }
}
