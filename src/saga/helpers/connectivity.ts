import { delay } from '@redux-saga/delay-p';
import { getProviderTimeoutThreshold } from '@src/ducks/providerConfigs';
import { providerStorage } from '@src/providers/providerStorage';
import { logger } from '@src/utils/logging';
import { apply, call, race, select } from 'redux-saga/effects';

/**
 * @description polls the offline state of a provider, then returns control to caller when it comes back online
 * @param {string} providerId
 */
export function* checkProviderConnectivity(providerId: string) {
  const provider = providerStorage.getInstance(providerId);
  const timeoutThreshold: ReturnType<
    typeof getProviderTimeoutThreshold
  > = yield select(getProviderTimeoutThreshold, providerId);
  try {
    const { lb } = yield /* TODO: JSFIX could not patch the breaking change:
    now race should be finished if any of effects resolved with END (by analogy with all)

    Suggested fix: Only relevant if any of the raced effects resolve with an END value. In most scenarios, this change can be ignored.*/
    race({
      lb: apply(provider, provider.getCurrentBlock),
      to: call(delay, timeoutThreshold),
    });
    return !!lb;
  } catch (error) {
    logger.log(error);
  }
  return false;
}
