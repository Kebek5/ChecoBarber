export type CategoryId = string;

export interface Category {
   readonly id: CategoryId;
   readonly name: string;
   readonly description: string;
}

export type CategoryRef = Pick<Category, 'id' | 'name'>