import { createRoot } from 'react-dom/client';
import Draft from './Draft';
import './community.css';
import './layout.css';
import './detail.css';
createRoot(document.getElementById('root')!).render(<Draft initialSearch={location.search} initialPath={location.pathname} />);
