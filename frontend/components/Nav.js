import Link from 'next/link'
import NavStyles from './styles/NavStyles';
import Signout from "./Signout";
import User from "./User";

const Nav = () => (
    <div>
        <NavStyles data-test="nav">
            <Link href="/sell" ><a>sell!</a></Link>
            <Link href="/" ><a>Home!</a></Link>
        </NavStyles>
    </div>
);

export default Nav







