import type { BuilderEventAttestation } from './easSchemas/builderEventSchema';
import { encodeBuilderEventAttestation, BuilderEventAttestationType } from './easSchemas/builderEventSchema';

export async function attestBuilderEvent({ builderId, event }: { builderId: string; event: BuilderEventAttestation }) {
  const builderEventAttestation = encodeBuilderEventAttestation({
    builderId,
    type: BuilderEventAttestationType.BuilderEvent
  });
}
