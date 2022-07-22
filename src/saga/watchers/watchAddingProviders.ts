import { BALANCER } from '@src/ducks/providerBalancer/balancerConfig';
import { getNetwork } from '@src/ducks/providerBalancer/balancerConfig/selectors';
import {
  ProcessedProvider,
  providerAdded,
} from '@src/ducks/providerBalancer/providerStats';
import {
  IAddProviderConfig,
  PROVIDER_CONFIG,
} from '@src/ducks/providerConfigs/types';
import { processProvider } from '@src/saga/helpers/processing';
import { call, put, race, select, take, takeEvery } from 'redux-saga/effects';

function* handleAddingProviderConfig({
  payload: { config, id },
}: IAddProviderConfig) {
  const network: ReturnType<typeof getNetwork> = yield select(getNetwork);
  if (network !== config.network) {
    return;
  }

  const {
    processedProvider,
  }: { processedProvider: ProcessedProvider } = yield /* TODO: JSFIX could not patch the breaking change:
  now race should be finished if any of effects resolved with END (by analogy with all)

  Suggested fix: Only relevant if any of the raced effects resolve with an END value. In most scenarios, this change can be ignored.*/
  race({
    processedProvider: call(processProvider, id, config),
    cancelled: take(BALANCER.NETWORK_SWTICH_REQUESTED),
  });

  if (!processedProvider) {
    return;
  }

  yield put(providerAdded(processedProvider));
}

export const addProviderConfigWatcher = [
  takeEvery(PROVIDER_CONFIG.ADD, handleAddingProviderConfig),
];
