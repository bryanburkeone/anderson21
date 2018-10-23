import Items from '../components/Items';
import Link from 'next/link';

const Home = props => (
    <div>
        <Link href={'/sell'}>
            <a>sell</a>
        </Link>
        {/*<Items />*/}
    </div>
);

export default Home;