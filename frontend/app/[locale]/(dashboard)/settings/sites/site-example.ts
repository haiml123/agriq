import { Site } from '@/schemas/sites.schema';

export const testSites: Site[] = [
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Northern Storage Facility',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        address: 'Minneapolis, MN',
        latitude: 44.9778,
        longitude: -93.265,
        createdBy: 'user-001',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-06-20'),
        compounds: [
            {
                id: 'comp-001',
                name: 'Grain Block A',
                siteId: '550e8400-e29b-41d4-a716-446655440001',
                createdBy: 'user-001',
                createdAt: new Date('2024-01-16'),
                updatedAt: new Date('2024-06-18'),
                cells: [
                    {
                        id: 'cell-001',
                        name: 'Cell A-101',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 18,
                        humidity: 45,
                        compoundId: 'comp-001',
                        createdBy: 'user-001',
                        createdAt: new Date('2024-01-17'),
                        updatedAt: new Date('2024-06-15'),
                    },
                    {
                        id: 'cell-002',
                        name: 'Cell A-102',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 24,
                        humidity: 62,
                        compoundId: 'comp-001',
                        createdBy: 'user-001',
                        createdAt: new Date('2024-01-17'),
                        updatedAt: new Date('2024-06-15'),
                    },
                    {
                        id: 'cell-003',
                        name: 'Cell A-103',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 32,
                        humidity: 78,
                        compoundId: 'comp-001',
                        createdBy: 'user-001',
                        createdAt: new Date('2024-01-17'),
                        updatedAt: new Date('2024-06-15'),
                    },
                ],
            },
            {
                id: 'comp-002',
                name: 'Grain Block B',
                siteId: '550e8400-e29b-41d4-a716-446655440001',
                createdBy: 'user-001',
                createdAt: new Date('2024-02-10'),
                updatedAt: new Date('2024-06-12'),
                cells: [
                    {
                        id: 'cell-004',
                        name: 'Cell B-101',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 19,
                        humidity: 48,
                        compoundId: 'comp-002',
                        createdBy: 'user-001',
                        createdAt: new Date('2024-02-11'),
                        updatedAt: new Date('2024-06-10'),
                    },
                    {
                        id: 'cell-005',
                        name: 'Cell B-102',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 21,
                        humidity: 55,
                        compoundId: 'comp-002',
                        createdBy: 'user-001',
                        createdAt: new Date('2024-02-11'),
                        updatedAt: new Date('2024-06-10'),
                    },
                ],
            },
        ],
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Southern Distribution Hub',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        address: 'Dallas, TX',
        latitude: 32.7767,
        longitude: -96.797,
        createdBy: 'user-002',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-06-22'),
        compounds: [
            {
                id: 'comp-003',
                name: 'Silo Complex 1',
                siteId: '550e8400-e29b-41d4-a716-446655440002',
                createdBy: 'user-002',
                createdAt: new Date('2024-03-05'),
                updatedAt: new Date('2024-06-20'),
                cells: [
                    {
                        id: 'cell-006',
                        name: 'Silo 1-A',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 22,
                        humidity: 50,
                        compoundId: 'comp-003',
                        createdBy: 'user-002',
                        createdAt: new Date('2024-03-06'),
                        updatedAt: new Date('2024-06-18'),
                    },
                    {
                        id: 'cell-007',
                        name: 'Silo 1-B',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 28,
                        humidity: 68,
                        compoundId: 'comp-003',
                        createdBy: 'user-002',
                        createdAt: new Date('2024-03-06'),
                        updatedAt: new Date('2024-06-18'),
                    },
                    {
                        id: 'cell-008',
                        name: 'Silo 1-C',
                        status: 'BLOCKED',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 35,
                        humidity: 82,
                        compoundId: 'comp-003',
                        createdBy: 'user-002',
                        createdAt: new Date('2024-03-06'),
                        updatedAt: new Date('2024-06-18'),
                    },
                    {
                        id: 'cell-009',
                        name: 'Silo 1-D',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 20,
                        humidity: 44,
                        compoundId: 'comp-003',
                        createdBy: 'user-002',
                        createdAt: new Date('2024-03-06'),
                        updatedAt: new Date('2024-06-18'),
                    },
                ],
            },
            {
                id: 'comp-004',
                name: 'Silo Complex 2',
                siteId: '550e8400-e29b-41d4-a716-446655440002',
                createdBy: 'user-002',
                createdAt: new Date('2024-04-01'),
                updatedAt: new Date('2024-06-21'),
                cells: [
                    {
                        id: 'cell-010',
                        name: 'Silo 2-A',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 17,
                        humidity: 42,
                        compoundId: 'comp-004',
                        createdBy: 'user-002',
                        createdAt: new Date('2024-04-02'),
                        updatedAt: new Date('2024-06-19'),
                    },
                    {
                        id: 'cell-011',
                        name: 'Silo 2-B',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 19,
                        humidity: 46,
                        compoundId: 'comp-004',
                        createdBy: 'user-002',
                        createdAt: new Date('2024-04-02'),
                        updatedAt: new Date('2024-06-19'),
                    },
                ],
            },
            {
                id: 'comp-005',
                name: 'Emergency Reserve',
                siteId: '550e8400-e29b-41d4-a716-446655440002',
                createdBy: 'user-002',
                createdAt: new Date('2024-05-15'),
                updatedAt: new Date('2024-06-22'),
                cells: [
                    {
                        id: 'cell-012',
                        name: 'Reserve Unit 1',
                        status: 'ACTIVE',
                        height: 10,

                        length: 20,

                        width: 15,
                        temp: 16,
                        humidity: 40,
                        compoundId: 'comp-005',
                        createdBy: 'user-002',
                        createdAt: new Date('2024-05-16'),
                        updatedAt: new Date('2024-06-20'),
                    },
                ],
            },
        ],
    },
];