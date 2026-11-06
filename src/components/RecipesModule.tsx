import React, { useState } from 'react';
import { 
  ChefHat, 
  Plus, 
  Trash2, 
  Edit2,
  Percent, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Flame, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Recipe, Ingredient, Product } from '../types/padaria';
import { storage } from '../services/storage';

export const RecipesModule: React.FC = () => {
  const stockProducts: Product[] = storage.getProducts();
  const [recipes, setRecipes] = useState<Recipe[]>(() => storage.getRecipes());
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(recipes[0]?.id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // Form para nova ficha técnica
  const [recipeName, setRecipeName] = useState('');
  const [category, setCategory] = useState<'PAES' | 'CONFEITARIA' | 'SALGADOS'>('PAES');
  const [yieldUnits, setYieldUnits] = useState(50);
  const [yieldDesc, setYieldDesc] = useState('50 pães de 50g assados');
  const [targetMargin, setTargetMargin] = useState(65);
  const [overheadPercent, setOverheadPercent] = useState(15);
  const [preparationTime, setPreparationTime] = useState(90);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: 'Farinha de Trigo Especial', quantity: 2.5, unit: 'kg', unitCost: 4.20, totalCost: 10.50 },
    { name: 'Fermento Biológico Fresco', quantity: 0.05, unit: 'kg', unitCost: 18.00, totalCost: 0.90 }
  ]);

  const handleAddIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { name: '', quantity: 1, unit: 'kg', unitCost: 0, totalCost: 0 }
    ]);
  };

  const handleUpdateIngredient = (idx: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    const item = { ...updated[idx], [field]: value };
    item.totalCost = item.quantity * item.unitCost;
    updated[idx] = item;
    setIngredients(updated);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const calculateTotals = () => {
    const rawCost = ingredients.reduce((acc, ing) => acc + (ing.quantity * ing.unitCost), 0);
    const totalBatch = rawCost * (1 + (overheadPercent / 100));
    const unitCost = yieldUnits > 0 ? totalBatch / yieldUnits : 0;
    const marginDec = (targetMargin / 100);
    const suggestedPrice = marginDec < 1 ? unitCost / (1 - marginDec) : unitCost * 2;
    return { rawCost, totalBatch, unitCost, suggestedPrice };
  };

  const resetRecipeForm = () => {
    setRecipeName(''); setCategory('PAES'); setYieldUnits(50); setYieldDesc('50 pães de 50g assados');
    setTargetMargin(65); setOverheadPercent(15); setPreparationTime(90);
    setIngredients([
      { name: 'Farinha de Trigo Especial', quantity: 2.5, unit: 'kg', unitCost: 4.20, totalCost: 10.50 },
      { name: 'Fermento Biológico Fresco', quantity: 0.05, unit: 'kg', unitCost: 18.00, totalCost: 0.90 }
    ]);
  };
  const openNewRecipe = () => { setEditingRecipe(null); resetRecipeForm(); setIsAddModalOpen(true); };
  const openEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe); setRecipeName(recipe.name); setCategory(recipe.category); setYieldUnits(recipe.yieldUnits);
    setYieldDesc(recipe.yieldDescription); setTargetMargin(recipe.targetMarginPercent);
    setOverheadPercent(recipe.overheadMarkupPercent); setPreparationTime(recipe.preparationTimeMinutes);
    setIngredients(recipe.ingredients.map((ingredient) => ({ ...ingredient })));
    setIsAddModalOpen(true);
  };
  const handleDeleteRecipe = () => {
    if (!recipeToDelete) return;
    const updated = recipes.filter((recipe) => recipe.id !== recipeToDelete.id);
    setRecipes(updated); storage.saveRecipes(updated); storage.logAction('FICHA TÉCNICA', 'Ficha excluída: '+recipeToDelete.name);
    if (expandedRecipeId === recipeToDelete.id) setExpandedRecipeId(updated[0]?.id || null);
    setRecipeToDelete(null);
  };

  const handleSaveNewRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim() || ingredients.length === 0 || yieldUnits <= 0) return;
    if (ingredients.some((ingredient) => !ingredient.name.trim() || ingredient.quantity <= 0)) return;

    const { rawCost, totalBatch, unitCost, suggestedPrice } = calculateTotals();

    const newRecipe: Recipe = {
      id: editingRecipe?.id || 'rec_' + Date.now(),
      name: recipeName.trim(),
      category,
      yieldUnits,
      yieldDescription: yieldDesc,
      preparationTimeMinutes: preparationTime,
      ingredients,
      rawIngredientsCost: rawCost,
      overheadMarkupPercent: overheadPercent,
      totalBatchCost: totalBatch,
      unitCost,
      targetMarginPercent: targetMargin,
      suggestedSalePrice: suggestedPrice,
      actualSalePrice: Math.ceil(suggestedPrice * 10) / 10,
      instructions: editingRecipe?.instructions || [
        'Misturar os secos na masseira.',
        'Homogeneizar e cilindrar até obter ponto de véu.',
        'Assar na temperatura indicada.'
      ]
    };

    const all = editingRecipe ? recipes.map((recipe) => recipe.id === editingRecipe.id ? newRecipe : recipe) : [newRecipe, ...recipes];
    setRecipes(all); storage.saveRecipes(all); storage.logAction('FICHA TÉCNICA', `${editingRecipe ? 'Ficha atualizada' : 'Ficha criada'}: ${newRecipe.name}`); setExpandedRecipeId(newRecipe.id);
    setIsAddModalOpen(false); setEditingRecipe(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explicativo */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-500" />
            <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-50">
              Fichas Técnicas & Formação de Preço (CMV)
            </h2>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Padronize o custo exato das suas receitas de panificação e confeitaria. O sistema calcula automaticamente o Custo de Mercadoria Vendida (CMV), adiciona o custo de forno e energia, e calcula a margem líquida e o preço de venda ideal.
          </p>
        </div>

        <button
          onClick={openNewRecipe}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ficha Técnica</span>
        </button>
      </div>

      {/* Lista de Fichas Técnicas */}
      <div className="space-y-4">
        {recipes.map((recipe) => {
          const isExpanded = expandedRecipeId === recipe.id;
          return (
            <div
              key={recipe.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-all"
            >
              {/* Header do Card da Receita */}
              <div
                onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    {recipe.category === 'PAES' ? '🥖' : recipe.category === 'CONFEITARIA' ? '🍰' : '🥟'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      {recipe.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span>Rendimento: {recipe.yieldDescription}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{recipe.preparationTimeMinutes} min</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumo de Custos e Margens */}
                <div className="flex items-center gap-6 font-mono tabular-nums">
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block font-sans">Custo Unitário</span>
                    <span className="font-extrabold text-sm text-neutral-800 dark:text-neutral-200">
                      R$ {recipe.unitCost.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block font-sans">Preço de Venda</span>
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      R$ {recipe.actualSalePrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] text-neutral-400 block font-sans">Margem Bruta</span>
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      {recipe.targetMarginPercent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-neutral-400">
                    <button type="button" aria-label={"Editar ficha " + recipe.name} title="Editar ficha técnica" onClick={(event) => { event.stopPropagation(); openEditRecipe(recipe); }} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"><Edit2 className="w-4 h-4" /></button>
                    <button type="button" aria-label={"Excluir ficha " + recipe.name} title="Excluir ficha técnica" onClick={(event) => { event.stopPropagation(); setRecipeToDelete(recipe); }} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"><Trash2 className="w-4 h-4" /></button>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Detalhamento Expandido dos Ingredientes e Instruções */}
              {isExpanded && (
                <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-6">
                  {/* Tabela de Ingredientes */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                      Ingredientes da Fornada / Batelada
                    </h4>
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs font-mono tabular-nums">
                        <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 font-semibold font-sans">
                          <tr>
                            <th className="py-2.5 px-4">Ingrediente</th>
                            <th className="py-2.5 px-4 text-right">Qtd Usada</th>
                            <th className="py-2.5 px-4 text-right">Custo / Unidade</th>
                            <th className="py-2.5 px-4 text-right">Custo Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {recipe.ingredients.map((ing, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-4 font-sans font-medium text-neutral-800 dark:text-neutral-200">
                                {ing.name}
                              </td>
                              <td className="py-2 px-4 text-right">
                                {ing.quantity} {ing.unit}
                              </td>
                              <td className="py-2 px-4 text-right text-neutral-500">
                                R$ {ing.unitCost.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                R$ {ing.totalCost.toFixed(2).replace('.', ',')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-neutral-50 dark:bg-neutral-800 font-bold border-t border-neutral-200 dark:border-neutral-700">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-4 font-sans text-neutral-700 dark:text-neutral-300">
                              Custo de Insumos Diretos
                            </td>
                            <td className="py-2.5 px-4 text-right text-neutral-900 dark:text-neutral-100">
                              R$ {recipe.rawIngredientsCost.toFixed(2).replace('.', ',')}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="py-2 px-4 font-sans text-xs text-neutral-500 font-normal">
                              (+) Custos Indiretos ({recipe.overheadMarkupPercent}% para Gás de Forno, Eletricidade e Mão de Obra)
                            </td>
                            <td className="py-2 px-4 text-right text-xs text-neutral-500">
                              R$ {(recipe.totalBatchCost - recipe.rawIngredientsCost).toFixed(2).replace('.', ',')}
                            </td>
                          </tr>
                          <tr className="border-t border-neutral-200 dark:border-neutral-700 text-sm">
                            <td colSpan={3} className="py-2.5 px-4 font-sans text-emerald-600 dark:text-emerald-400">
                              Custo Total da Fornada Completa ({recipe.yieldUnits} un)
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400">
                              R$ {recipe.totalBatchCost.toFixed(2).replace('.', ',')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Modo de Preparo */}
                  {recipe.instructions && recipe.instructions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                        Passo a Passo de Produção
                      </h4>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        {recipe.instructions.map((step, idx) => (
                          <li key={idx} className="pl-1">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Nova Ficha Técnica */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 mb-1">
              {editingRecipe ? 'Editar Ficha Técnica' : 'Criar Ficha Técnica de Padaria / Confeitaria'}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Informe a receita, ingredientes e rendimento para atualizar os cálculos de CMV
            </p>

            <form onSubmit={handleSaveNewRecipe} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Nome da Receita:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Torta Alemã de Chocolate"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'PAES' | 'CONFEITARIA' | 'SALGADOS')}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  >
                    <option value="PAES">Pães & Fornada</option>
                    <option value="CONFEITARIA">Confeitaria & Bolos</option>
                    <option value="SALGADOS">Salgados & Massas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Rendimento (Unidades):</label>
                  <input
                    type="number"
                    min="1"
                    value={yieldUnits}
                    onChange={(e) => setYieldUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Descrição Rendimento:</label>
                  <input
                    type="text"
                    value={yieldDesc}
                    onChange={(e) => setYieldDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Margem Alvo Desejada (%):</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="font-semibold block mb-1">Tempo de preparo (minutos):</label><input type="number" min="1" value={preparationTime} onChange={(e) => setPreparationTime(Number(e.target.value))} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono" /></div>
                <div><label className="font-semibold block mb-1">Custos indiretos (%):</label><input type="number" min="0" max="500" value={overheadPercent} onChange={(e) => setOverheadPercent(Number(e.target.value))} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono" /></div>
              </div>

              {/* Tabela Interativa de Ingredientes da Receita */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs uppercase text-neutral-600 dark:text-neutral-400">
                    Ingredientes & Insumos
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Ingrediente</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nome do ingrediente"
                        value={ing.name}
                        onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                        className="flex-2 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs"
                      />
                      <select aria-label="Vincular ingrediente ao estoque" value={ing.stockProductId || ""} onChange={(e) => handleUpdateIngredient(idx, 'stockProductId' as keyof Ingredient, e.target.value)} className="max-w-36 px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs"><option value="">Sem vínculo de estoque</option>{stockProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Qtd"
                        value={ing.quantity || ''}
                        onChange={(e) => handleUpdateIngredient(idx, 'quantity', Number(e.target.value))}
                        className="w-20 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-mono"
                      />
                      <select
                        value={ing.unit}
                        onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                        className="w-16 px-1 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                        <option value="un">un</option>
                      </select>
                      <input
                        type="number"
                        step="0.10"
                        placeholder="Custo/un"
                        value={ing.unitCost || ''}
                        onChange={(e) => handleUpdateIngredient(idx, 'unitCost', Number(e.target.value))}
                        className="w-24 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-mono"
                      />
                      <span className="w-20 text-right font-mono font-bold text-xs">
                        R$ {(ing.quantity * ing.unitCost).toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-neutral-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingRecipe(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  {editingRecipe ? 'Salvar Alterações' : 'Salvar Ficha Técnica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recipeToDelete && <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl"><h3 className="text-base font-bold">Excluir ficha técnica?</h3><p className="mt-2 text-sm text-neutral-500">A ficha “{recipeToDelete.name}” será removida permanentemente deste aparelho.</p><div className="mt-5 flex gap-3"><button onClick={() => setRecipeToDelete(null)} className="flex-1 rounded-xl border px-3 py-2 font-semibold">Manter ficha</button><button onClick={handleDeleteRecipe} className="flex-1 rounded-xl bg-red-600 px-3 py-2 font-bold text-white">Excluir</button></div></div></div>}
    </div>
  );
};
