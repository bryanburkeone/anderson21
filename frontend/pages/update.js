import UpdateItem from '../components/UpdateItem'
import React from 'react';

const Sell = ({ query }) => (
    <div>
        <UpdateItem id={query.id}/>
    </div>
);

export default Sell