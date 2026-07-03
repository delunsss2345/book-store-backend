import { AdminBookService } from '@/modules/admin/book/service/admin-book.service';
import { Test } from '@nestjs/testing';
import { AdminBookController } from '../admin-book.controller';
describe('AdminBook Controller', () => {
    let controller: AdminBookController

    const mockAdminBookService = {
        getStats: jest.fn(),
    };

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AdminBookController],
            providers: [
                {
                    provide: AdminBookService,
                    useValue: mockAdminBookService
                },
            ],
        }).compile();
        controller = moduleRef.get(AdminBookController);
    })

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should call getStats service', async () => {
        const mockResult = { totalBook: 10 }
        mockAdminBookService.getStats.mockResolvedValue(mockResult);

        const result = await controller.getStats();

        expect(mockAdminBookService.getStats).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockResult);
    })
})