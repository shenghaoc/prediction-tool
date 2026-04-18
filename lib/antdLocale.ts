import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

export function getAntdLocale(language: string): Locale {
	return language === 'zh' ? zhCN : enUS;
}
