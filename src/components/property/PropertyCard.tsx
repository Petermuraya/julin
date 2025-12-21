import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  id: string;
  title: string;
  location?: string;
  price?: string;
};

const PropertyCard: React.FC<Props> = ({ id, title, location = '', price = '' }) => {
  return (
    <Link to={`/property/${id}`} className="block">
      <article className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 p-4">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{location}</p>
        <div className="mt-3 font-bold">{price}</div>
      </article>
    </Link>
  );
};

export default PropertyCard;
