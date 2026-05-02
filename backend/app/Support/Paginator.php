<?php
namespace app\Support;

class Paginator
{

    public static function Pagination($queryBuilder, $page = 1, $perPage = 30, $maxPerPage = 100)
    {
        $page = max(1, (int) $page);
        $perPage = max(1, min($maxPerPage, (int) $perPage));

        $total = (clone $queryBuilder)->count();

        // amount to jump over.
        $offset = ($page - 1) * $perPage;
        // e.g. -> page 3:perPage = 30:Records:90
        // e.g. -> page 2 -> (2-1) * 30 = 30 records to jump over.
        $results = $queryBuilder
            ->skip($offset)
            ->take($perPage)
            ->get();

        $lastPage = (int) ceil($total / $perPage);

        return [
            'data' => $results,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $lastPage,
                'from' => $total === 0 ? null : $offset + 1,
                'to' => $total === 0 ? null : min($offset + $perPage, $total),
                'has_more' => $page < $lastPage,
            ],
        ];
    }

}