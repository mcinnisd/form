import { LangGraphService } from '../langGraph';

describe('LangGraphService', () => {
  let service: LangGraphService;

  beforeEach(() => {
    service = new LangGraphService();
  });

  it('should process a message with memories', async () => {
    const memories = [
      { category: 'Allergy', content: 'Allergic to tree nuts' },
      { category: 'Preference', content: 'Likes morning workouts' }
    ];

    const response = await service.processMessage(
      "What should I eat for breakfast?",
      memories
    );

    expect(response).toBeTruthy();
    // Add more specific assertions based on expected response
  });

  it('should process a message without memories', async () => {
    const response = await service.processMessage(
      "How can I start exercising?"
    );

    expect(response).toBeTruthy();
  });
}); 