import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { Theme } from '@iobroker/adapter-react-v5';
import App from './App';

const theme = Theme('light');

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<StyledEngineProvider injectFirst>
		<ThemeProvider theme={theme}>
			<App />
		</ThemeProvider>
	</StyledEngineProvider>,
);
