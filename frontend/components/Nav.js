import Link from 'next/link'
import NavStyles from './styles/NavStyles';
import Sell from "../pages/sell";
import Signout from "./Signout";
import User from "./User";

const Nav = () => (
<User>
    {({data: { me }}) => (
        <NavStyles>
            <Link href="/items"><a>Shop</a></Link>
            {me && (
                <>
                    <Link href="/sell"><a>Sell</a></Link>
                    <Link href="/orders"><a>Orders</a></Link>
                    <Link href="/me"><a>Account</a></Link>
                    <Signout />
                </>
            )}
            {!me && (
                <Link href="/signup"><a>Signin</a></Link>
            )}
        </NavStyles>
    )}
</User>
);

export default Nav







