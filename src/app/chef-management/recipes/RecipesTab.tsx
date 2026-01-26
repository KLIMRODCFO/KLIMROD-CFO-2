"use client";
import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";
import RecipeForm from "./RecipeForm";

export default function RecipesTab() {
  return (
    <div className="w-full">
      <RecipeForm />
    </div>
  );
}
