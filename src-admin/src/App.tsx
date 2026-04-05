import React from 'react';
import { GenericApp, I18n, Loader } from '@iobroker/adapter-react-v5';
import type { GenericAppProps, GenericAppState } from '@iobroker/adapter-react-v5';
import { Box, Tab, Tabs } from '@mui/material';
import PasswordsTable from './components/PasswordsTable';
import EmailsTable from './components/EmailsTable';
import SettingsPanel from './components/SettingsPanel';
import type { PwnedCheckConfig } from './types';

import en from './i18n/en.json';
import de from './i18n/de.json';
import ru from './i18n/ru.json';
import pt from './i18n/pt.json';
import nl from './i18n/nl.json';
import fr from './i18n/fr.json';
import it from './i18n/it.json';
import es from './i18n/es.json';
import pl from './i18n/pl.json';
import uk from './i18n/uk.json';
import zhCn from './i18n/zh-cn.json';

interface AppState extends GenericAppState {
	tab: number;
}

class App extends GenericApp<GenericAppProps, AppState> {
	constructor(props: GenericAppProps) {
		super(props, {
			encryptedFields: [],
			translations: { en, de, ru, pt, nl, fr, it, es, pl, uk, 'zh-cn': zhCn },
		} as any);
		this.state = {
			...this.state,
			tab: 0,
		};
	}

	getNative(): PwnedCheckConfig {
		return this.state.native as unknown as PwnedCheckConfig;
	}

	render(): React.JSX.Element {
		if (!this.state.loaded) {
			return <Loader />;
		}

		const native = this.getNative();

		return (
			<div className="App">
				<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
					<Tabs value={this.state.tab} onChange={(_e, v: number) => this.setState({ tab: v })}>
						<Tab label={I18n.t('tabPasswords')} />
						<Tab label={I18n.t('tabEmails')} />
						<Tab label={I18n.t('tabSettings')} />
					</Tabs>
				</Box>

				{this.state.tab === 0 && (
					<PasswordsTable
						passwords={native.passwords ?? []}
						onChange={passwords => this.updateNativeValue('passwords', passwords)}
					/>
				)}
				{this.state.tab === 1 && (
					<EmailsTable
						emails={native.emails ?? []}
						onChange={emails => this.updateNativeValue('emails', emails)}
					/>
				)}
				{this.state.tab === 2 && (
					<SettingsPanel
						native={native}
						onChange={(newNative: PwnedCheckConfig) => {
							Object.keys(newNative).forEach(key => {
								if (key !== 'passwords' && key !== 'emails') {
									this.updateNativeValue(key, (newNative as any)[key]);
								}
							});
						}}
						socket={this.socket}
						instance={this.instance}
					/>
				)}

				{this.renderError()}
				{this.renderSaveCloseButtons()}
			</div>
		);
	}
}

export default App;
