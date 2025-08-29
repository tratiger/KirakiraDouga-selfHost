import type { TranslateOptions } from "@intlify/core-base";
import type { I18nArgsFunction, LocaleWithDefaultValue } from "../i18n/locales/types";

const currentI18n = computed(() => useNuxtApp().$i18n);

// 如果需要 <i18n> 块内语言字符串：useI18n({ useScope: "local" })

const getProxy = (options: TranslateOptions | typeof targetFunction) =>
	new Proxy(options, {
		get(target, rootName) {
			if (rootName === "__v_isRef" || typeof rootName === "symbol") return; // Vue 干的好事。
			if (typeof target === "function") target = {};
			const getParentsPrefix = (...prefixes: string[]) => prefixes.length > 0 ? prefixes.join(".") : "";
			const i18n = currentI18n.value;
			const getDeclarationInfo = (...keys: string[]) => {
				const key = getParentsPrefix(...keys);
				const raw: string | object = i18n.tm(key);
				return {
					isNamespace: typeof raw === "object" && Object.keys(raw).length > 0,
					includesInterpolation: typeof raw === "string" && raw.includes("{"),
					missing: typeof raw === "object" && Object.keys(raw).length === 0,
					missingDefault: typeof raw === "object" && !("_" in raw),
					key,
					raw,
				};
			};
			const getMissingKey = (key: string, getAFunction: boolean = true) => {
				const displayValue = `<${key}>`;
				if (!getAFunction) return displayValue;
				const missingKey = () => missingKey;
				missingKey.toString = () => displayValue;
				return missingKey;
			};
			const translate = (keys: string[], list: Readable[] = []) => {
				const { isNamespace, missingDefault } = getDeclarationInfo(...keys);
				if (missingDefault) return getMissingKey(getParentsPrefix(...keys), false);
				const key = !isNamespace ? getParentsPrefix(...keys) : getParentsPrefix(...keys, "_");
				return i18n.t(key, typeof list[0] === "object" ? list[0] : list, {
					fallbackWarn: false,
					missingWarn: false,
					...target,
				});
			};
			const getWithArgsFunction = (...prefixes: string[]) =>
				(...args: Readable[]) =>
					translate(prefixes, typeof args[0] === "object" ? args[0] : args);
			const getWithArgsProxy = (...parents: string[]) => {
				const keys = [rootName, ...parents];
				const info = getDeclarationInfo(...keys);
				if (info.missing)
					return getMissingKey(info.key);
				else if (!info.includesInterpolation && !info.isNamespace)
					return translate(keys);
				else return new Proxy(getWithArgsFunction(...keys), {
					get(_target, currentName): unknown {
						if (currentName === Symbol.toPrimitive || currentName === "toString")
							return () => translate(keys);
						if (typeof currentName === "string")
							return getWithArgsProxy(...parents, currentName);
					},
				});
			};
			return getWithArgsProxy();
		},
	}) as LocaleDictionary;
const targetFunction = (options?: number | bigint | TranslateOptions) => {
	if (options === undefined) options = {};
	else if (typeof options === "number" || typeof options === "bigint") options = { plural: Number(options) };
	return getProxy(options);
};
type LocaleDictionary = LocaleWithDefaultValue & Readonly<Record<string, string & I18nArgsFunction>> & typeof targetFunction;
/** 获取本地化字符串对象。 */
export const t = getProxy(targetFunction);
Object.freeze(t);

/**
 * 获取当前语言名称。
 * @returns 当前语言名称。
 */
export function getCurrentLocale() {
	return useNuxtApp().$i18n.locale.value;
}

/**
 * 获取当前语言的语言代码。（主要是为了单独处理简体中文、繁体中文和粤语。）
 * @param locale - 手动指定语言代码，留空时会自动获取。
 * @param redirectDialect - 是否重定向方言到基础语言？（例如粤语会重定向到香港地区繁体中文。）这是因为这些方言的内置本地化处理函数支持率太低太烂。
 * @returns 语言代码。
 */
export function getCurrentLocaleLangCode(locale?: string, redirectDialect: boolean = false) {
	locale ||= getCurrentLocale();
	return locale === "zhs" ? "zh-Hans-CN" :
		locale === "zht" ? "zh-Hant-TW" :
		redirectDialect && locale === "yue" ? "zh-Hant-HK" :
		locale;
}

/**
 * 获取目标语言在当前显示语言中的名称。
 * @param targetLocale - 目标语言。
 * @param displayLocale - 当前显示语言，留空时会自动获取。
 * @returns 语言名称。
 * @example
 * ```typescript
 * console.log(getLocaleName("en", "zh")); // "英语"
 * console.log(getLocaleName("zh", "en")); // "Chinese"
 * ```
 */
export function getLocaleName(targetLocale: string | Intl.Locale, displayLocale?: string | Intl.Locale) {
	if (targetLocale instanceof Intl.Locale) targetLocale = targetLocale.toString();
	if (displayLocale instanceof Intl.Locale) displayLocale = displayLocale.toString();
	targetLocale = targetLocale === "zhs" ? "zh-Hans" : targetLocale === "zht" ? "zh-Hant" : targetLocale;
	displayLocale = getCurrentLocaleLangCode(displayLocale);
	const fallbackLocales = [displayLocale];
	if (displayLocale === "yue") fallbackLocales.push("zh-Hant-HK");
	return new Intl.DisplayNames(fallbackLocales, { type: "language" }).of(targetLocale)!;
}

/**
 * 处于语境翻译工具模式？
 * @param locale - 指示当前语言环境。
 * @returns 获取是否处于语境翻译工具模式的计算响应式变量。
 */
export function isInContextLocalization(locale?: string) {
	return computed(() => {
		return locale === "ii" || currentI18n.value.locale.value === "ii";
	});
}
