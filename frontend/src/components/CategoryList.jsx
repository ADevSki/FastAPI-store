import CategoryCard from "./CategoryCard";

function CategoryList({
  categories,
  isAdmin,
  onDelete,
  onEdit,
}) {
  return (
    <section className="categories">

      <div className="category-list">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isAdmin={isAdmin}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

    </section>
  );
}

export default CategoryList;