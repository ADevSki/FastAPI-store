import { useNavigate } from "react-router-dom";

function CategoryCard({ category, isAdmin, onDelete, onEdit }) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/category/${category.slug}/`);
  }

  function handleDelete(event) {
    event.stopPropagation();
    onDelete(category);
  }

  function handleEdit(event) {
    event.stopPropagation();
    onEdit(category);
  }

  return (
    <article
      className="category-card"
      onClick={handleClick}
    >
      {category.image_url ? (
        <img
          src={category.image_url}
          alt={category.name}
        />
      ) : (
        <div className="category-no-image">
          Нет изображения
        </div>
      )}

      <div className="category-name">
        {category.name}
      </div>

      {isAdmin && (
        <div className="category-actions">

          <button
            type="button"
            className="category-action edit"
            onClick={handleEdit}
            aria-label="Редактировать категорию"
          >
            ✎
          </button>

          <button
            type="button"
            className="category-action delete"
            onClick={handleDelete}
            aria-label="Удалить категорию"
          >
            ×
          </button>

        </div>
      )}
    </article>
  );
}

export default CategoryCard;