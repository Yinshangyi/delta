/**
 * The one place a locale is decided.
 *
 * Not `navigator.language`: the household's figures are euros on a French
 * calendar whatever machine they are read on, and a projection that renders
 * differently on a borrowed laptop is a projection nobody trusts. Changing this
 * constant changes every figure and date in the app.
 */
export const LOCALE = "en-GB"

export const CURRENCY = "EUR"
