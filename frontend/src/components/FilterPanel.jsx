function FilterPanel({
  filters,
  setFilters,
  onApply,
  onReset,
  disabled,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onApply();
  }

  function handleReset(event) {
    event.preventDefault();
    onReset();
  }

  return (
    <form className="filters" onSubmit={handleSubmit}>
      <h2>Фильтры</h2>

      <div className="filter-row">
        <label>
          Поиск
          <input
            type="text"
            placeholder="Название товара"
            value={filters.search}
            onChange={(event) =>
              setFilters({
                ...filters,
                search: event.target.value,
              })
            }
          />
        </label>
      </div>

      <div className="filter-row">
        <label>
          Цена от
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice}
            onChange={(event) =>
              setFilters({
                ...filters,
                minPrice: event.target.value,
              })
            }
          />
        </label>

        <label>
          Цена до
          <input
            type="number"
            placeholder="150000"
            value={filters.maxPrice}
            onChange={(event) =>
              setFilters({
                ...filters,
                maxPrice: event.target.value,
              })
            }
          />
        </label>
      </div>

      <div className="filter-row">
        <label>
          Наличие
          <select
            value={
              filters.inStock === null
                ? "all"
                : String(filters.inStock)
            }
            onChange={(event) => {
              const value = event.target.value;

              setFilters({
                ...filters,
                inStock:
                  value === "all"
                    ? null
                    : value === "true",
              });
            }}
          >
            <option value="all">Все товары</option>
            <option value="true">Только в наличии</option>
            <option value="false">Нет в наличии</option>
          </select>
        </label>
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.sortByDate}
          onChange={(event) =>
            setFilters({
              ...filters,
              sortByDate: event.target.checked,
            })
          }
        />
        Сначала новые
      </label>

      <div className="filter-buttons">
        <button
          type="submit"
          className="apply-button"
          disabled={disabled}
        >
          Применить фильтры
        </button>

        <button
          type="button"
          className="reset-button"
          onClick={handleReset}
          disabled={disabled}
        >
          Сбросить
        </button>
      </div>
    </form>
  );
}

export default FilterPanel;