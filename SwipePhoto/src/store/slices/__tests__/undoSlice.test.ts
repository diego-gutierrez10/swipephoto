import undoReducer, {
  recordSwipeAction,
  undoLastAction,
  clearUndoStack,
  setMaxUndoActions,
} from '../undoSlice';
import { RecordSwipeActionPayload, UndoState } from '../../../types/undo';

describe('undoSlice reducer', () => {
  let initialState: UndoState;

  beforeEach(() => {
    initialState = {
      undoStack: [],
      maxUndoActions: 3,
      lastUndoneAction: null,
    };
  });

  it('should handle initial state', () => {
    expect(undoReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should record a swipe action', () => {
    const payload: RecordSwipeActionPayload = {
      photoId: 'photo1',
      direction: 'right',
      previousIndex: 0,
      categoryId: 'kept',
    };
    const action = recordSwipeAction(payload);
    const newState = undoReducer(initialState, action);

    expect(newState.undoStack).toHaveLength(1);
    expect(newState.undoStack[0].photoId).toBe('photo1');
    expect(newState.undoStack[0].direction).toBe('right');
  });

  it('should undo the last action', () => {
    const stateWithAction: UndoState = {
      ...initialState,
      undoStack: [{ id: 'action1', photoId: 'photo1', direction: 'right', timestamp: Date.now(), previousState: { photoIndex: 0, categoryId: 'kept', wasInStack: true } }],
    };

    const action = undoLastAction();
    const newState = undoReducer(stateWithAction, action);

    expect(newState.undoStack).toHaveLength(0);
    expect(newState.lastUndoneAction).toBeDefined();
    expect(newState.lastUndoneAction?.id).toBe('action1');
  });

  it('should clear the undo stack', () => {
    const stateWithActions: UndoState = {
      ...initialState,
      undoStack: [
        { id: 'action1', photoId: 'photo1', direction: 'right', timestamp: Date.now(), previousState: { photoIndex: 0, categoryId: 'kept', wasInStack: true } },
        { id: 'action2', photoId: 'photo2', direction: 'left', timestamp: Date.now(), previousState: { photoIndex: 1, categoryId: 'deleted', wasInStack: true } },
      ],
    };

    const action = clearUndoStack();
    const newState = undoReducer(stateWithActions, action);

    expect(newState.undoStack).toHaveLength(0);
  });

  it('should respect the maxUndoActions limit', () => {
    let state = undoReducer(initialState, setMaxUndoActions(2));
    expect(state.maxUndoActions).toBe(2);

    const payload1: RecordSwipeActionPayload = { photoId: 'p1', direction: 'right', previousIndex: 0, categoryId: 'kept' };
    const payload2: RecordSwipeActionPayload = { photoId: 'p2', direction: 'left', previousIndex: 1, categoryId: 'deleted' };
    const payload3: RecordSwipeActionPayload = { photoId: 'p3', direction: 'right', previousIndex: 2, categoryId: 'kept' };
    
    state = undoReducer(state, recordSwipeAction(payload1));
    state = undoReducer(state, recordSwipeAction(payload2));
    state = undoReducer(state, recordSwipeAction(payload3));

    expect(state.undoStack).toHaveLength(2);
    expect(state.undoStack[0].photoId).toBe('p2'); // p1 should have been shifted out
    expect(state.undoStack[1].photoId).toBe('p3');
  });
}); 