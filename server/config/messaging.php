<?php

return [
    'default_provider' => env('CRM_MESSAGING_PROVIDER', 'whatsapp'),
    'templates' => [
        'student_enrollment' => env('CRM_WHATSAPP_STUDENT_TEMPLATE', 'student_enrollment'),
    ],
    'providers' => [
        'whatsapp' => [
            'endpoint' => env('CRM_WHATSAPP_ENDPOINT'),
            'token' => env('CRM_WHATSAPP_TOKEN'),
            'fake' => env('CRM_WHATSAPP_FAKE', true),
        ],
    ],
];
