-- Script para agregar campo delta a la tabla master_inventory_food
ALTER TABLE master_inventory_food
ADD delta INTEGER;

-- delta: diferencia entre projected_stock y physical_count, se actualiza solo al actualizar physical_count
