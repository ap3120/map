const REQUEST_TIMEOUT_MS = 15000;

const describeFailure = (jqXHR, textStatus) => {
    if (textStatus === 'timeout') {
        return 'the request timed out';
    }
    if (jqXHR.status === 0) {
        return 'the network is unavailable';
    }
    if (jqXHR.status === 429) {
        return 'the rate limit was reached, please try again shortly';
    }
    return jqXHR.responseJSON?.status?.description ?? `the request failed (HTTP ${jqXHR.status})`;
};

/**
 * POST to one of the php/ proxies and hand back a validated payload.
 *
 * Every proxy answers with {status: {code, ...}, data} and sets a matching HTTP
 * status, so jQuery routes upstream failures to `error` on its own. `onSuccess`
 * is called only when there is a non-null payload to render; everything else,
 * including a malformed envelope, goes to `onError` with a reason to display.
 */
export const apiCall = (url, data, {onSuccess, onError}) => {
    return $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        data: data,
        timeout: REQUEST_TIMEOUT_MS,
        success: (res) => {
            if (res?.status?.code !== 200 || res.data === null || res.data === undefined) {
                const reason = res?.status?.description ?? 'the response was malformed';
                console.error(`Request to ${url} returned an unusable payload: ${reason}`);
                onError(reason);
                return;
            }
            onSuccess(res.data);
        },
        error: (jqXHR, textStatus) => {
            const reason = describeFailure(jqXHR, textStatus);
            console.error(`Request to ${url} failed: ${reason}`);
            onError(reason);
        }
    });
};
