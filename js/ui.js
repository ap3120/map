const TOAST_DURATION_MS = 6000;

let toastTimer = null;

/**
 * Set an element's text, falling back to a placeholder for empty values so a
 * panel never keeps showing the previous country's data.
 */
export const setText = (selector, value, fallback = '—') => {
    const isEmpty = value === null || value === undefined || value === '';
    $(selector).text(isEmpty ? fallback : value);
};

/**
 * Show a failure message inside a panel, leaving its markup in place so the
 * panel still works once a later request succeeds.
 */
export const showPanelError = (bodySelector, message) => {
    const $body = $(bodySelector);
    let $error = $body.find('.panel-error');

    if ($error.length === 0) {
        $error = $('<p></p>').addClass('panel-error m-1');
        $body.prepend($error);
    }

    $error.text(message);
};

export const clearPanelError = (bodySelector) => {
    $(bodySelector).find('.panel-error').remove();
};

/**
 * For failures with no panel to render into: the initial load, geolocation and
 * the map-wide border layers.
 */
export const showToast = (message) => {
    const $toast = $('#toast');
    $toast.text(message).show();

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.fadeOut(), TOAST_DURATION_MS);
};
