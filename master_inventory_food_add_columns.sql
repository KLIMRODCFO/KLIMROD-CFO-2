-- Script para agregar columnas a la tabla master_inventory_food
ALTER TABLE master_inventory_food
ADD optimal_count INTEGER;

ALTER TABLE master_inventory_food
ADD physical_count INTEGER;

ALTER TABLE master_inventory_food
ADD projected_stock INTEGER;

-- optimal_count: número óptimo para mantener en inventario
-- physical_count: conteo físico actualizado por el porter
-- projected_stock: stock proyectado según cálculos de órdenes, ventas y desperdicio
