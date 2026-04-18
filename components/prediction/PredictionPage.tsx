import en from '../../app/locales/en.json';
import zh from '../../app/locales/zh.json';
import { FLAT_MODELS, ML_MODELS, TOWNS } from '../../lib/lists';
import PredictionClient from './PredictionClient';
import styles from './styles.module.css';

function LocalizedText({
	enText,
	zhText,
	enClassName,
	zhClassName
}: {
	enText: string;
	zhText: string;
	enClassName?: string;
	zhClassName?: string;
}) {
	return (
		<>
			<span className={`${styles.langEn}${enClassName ? ` ${enClassName}` : ''}`}>
				{enText}
			</span>
			<span className={`${styles.langZh}${zhClassName ? ` ${zhClassName}` : ''}`}>
				{zhText}
			</span>
		</>
	);
}

export default function PredictionPage() {
	const introContent = (
		<div className={styles.introBlock}>
			<div className={styles.headlineStack}>
				<LocalizedText
					enText={en.price_prediction}
					zhText={zh.price_prediction}
					enClassName={styles.headline}
					zhClassName={`${styles.headline} ${styles.headlineCjk}`}
				/>
			</div>
			<p className={styles.lead}>
				<LocalizedText enText={en.intro_blurb} zhText={zh.intro_blurb} />
			</p>

			<div className={styles.figureRow}>
				{[
					{
						enLabel: en.ml_model,
						zhLabel: zh.ml_model,
						value: ML_MODELS.length.toString().padStart(2, '0')
					},
					{
						enLabel: en.town,
						zhLabel: zh.town,
						value: TOWNS.length.toString().padStart(2, '0')
					},
					{
						enLabel: en.flat_model,
						zhLabel: zh.flat_model,
						value: FLAT_MODELS.length.toString().padStart(2, '0')
					}
				].map((item) => (
					<div key={item.enLabel} className={styles.figure}>
						<span className={styles.figureLabel}>
							<LocalizedText enText={item.enLabel} zhText={item.zhLabel} />
						</span>
						<strong className={styles.figureValue}>{item.value}</strong>
					</div>
				))}
			</div>

			<p className={styles.caption}>
				<LocalizedText enText={en.intro_caption} zhText={zh.intro_caption} />
			</p>
		</div>
	);

	return (
		<PredictionClient
			pillContent={
				<LocalizedText enText={en.intro_eyebrow} zhText={zh.intro_eyebrow} />
			}
			introContent={introContent}
		/>
	);
}
