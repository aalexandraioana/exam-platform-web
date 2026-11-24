<?php

namespace App\Http\Controllers;

use App\Http\Requests\Questions\CompetenceRequest;
use App\Http\Requests\Questions\NameRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** C-004: the Examiner's own competences, topics and pools; list and create only (Q-053). */
class BankListController extends Controller
{
    public function competences(Request $request): JsonResponse
    {
        $list = $request->user()->competences()->orderBy('code')->get(['id', 'code', 'description']);

        return response()->json(['competences' => $list]);
    }

    public function storeCompetence(CompetenceRequest $request): JsonResponse
    {
        $competence = $request->user()->competences()->create($request->validated());

        return response()->json(['competence' => $competence->only('id', 'code', 'description')], 201);
    }

    public function topics(Request $request): JsonResponse
    {
        return response()->json(['topics' => $request->user()->topics()->orderBy('name')->get(['id', 'name'])]);
    }

    public function storeTopic(NameRequest $request): JsonResponse
    {
        return response()->json(['topic' => $request->user()->topics()->create($request->validated())->only('id', 'name')], 201);
    }

    public function pools(Request $request): JsonResponse
    {
        return response()->json(['pools' => $request->user()->pools()->orderBy('name')->get(['id', 'name'])]);
    }

    public function storePool(NameRequest $request): JsonResponse
    {
        return response()->json(['pool' => $request->user()->pools()->create($request->validated())->only('id', 'name')], 201);
    }
}
