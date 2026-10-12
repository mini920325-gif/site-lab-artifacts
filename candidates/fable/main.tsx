import { createRoot } from 'react-dom/client';
import Draft from './Draft';
createRoot(document.getElementById('root')!).render(<Draft initialSearch={location.search} initialPath={location.pathname} />);
