import React from 'react';
import { Card } from '../types';
import { FournierCard } from './FournierCard';

interface CardViewProps {
  card?: Card;
  hidden?: boolean;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  hidden = false,
  selected = false,
  selectable = false,
  onClick,
  size = 'md',
}) => {
  return (
    <FournierCard
      card={card}
      hidden={hidden}
      selected={selected}
      selectable={selectable}
      onClick={onClick}
      size={size}
    />
  );
};
