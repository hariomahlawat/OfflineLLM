import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import AdminPage from './admin/AdminPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <AdminPage />
    </ChakraProvider>
  </React.StrictMode>
);

