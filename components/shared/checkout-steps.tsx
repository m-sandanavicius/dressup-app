import { cn } from '@/lib/utils';
import React from 'react';

export default function CheckoutSteps({ current = 0 }) {
  return (
    <div className="flex-between flex-col md:flex-row space-x-2 space-y-2  mb-10">
      {['User Login', 'Shipping Address', 'Payment', 'Review'].map(
        (step, index) => (
          <React.Fragment key={index}>
            <div
              className={cn(
                'flex items-center p-2 w-56 rounded-full text-center text-sm gap-2',
                index === current ? 'bg-secondary' : '',
              )}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= current ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                <span>{index + 1}</span>
              </div>
              <div className="inline-flex">{step}</div>
              {/* {step} */}

              {/* {step !== 'Review' && (
                <hr className="w-16 border-t border-gray-300 mx-2" />
              )} */}
            </div>
          </React.Fragment>
        ),
      )}
    </div>
  );
}
